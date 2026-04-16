import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/common/database/prisma.service';
import { RedisService, MachineState } from '@/common/redis/redis.service';
import { AppLoggerService } from '@/common/logger/logger.service';
import { parseMMSS } from '@/core/utils/time.util';
import { STOP_TIMER_MS } from '@/core/constants/machine.constants';

@Injectable()
export class SensorsService {
  private stopTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private events: EventEmitter2,
    private logger: AppLoggerService,
  ) {}

  /**
   * Get or create machine state
   */
  async getOrCreateMachineState(machineId: string): Promise<MachineState> {
    let state = await this.redis.getMachineState(machineId);

    if (!state) {
      state = {
        id: machineId,
        status: 'online',
        lastSeen: new Date(),
      };
      await this.redis.setMachineState(machineId, state);

      // Ensure device exists in database
      await this.ensureDeviceExists(machineId);
    }

    return state;
  }

  /**
   * Ensure device exists in database (using Prisma Machine model)
   */
  private async ensureDeviceExists(machineId: string) {
    try {
      await this.prisma.machine.upsert({
        where: { id: machineId },
        update: { lastSeen: new Date() },
        create: {
          id: machineId,
          status: 'online',
          lastSeen: new Date(),
        } as any,
      });
    } catch (error: any) {
      this.logger.error(`Error ensuring device exists: ${error?.message}`);
    }
  }

  /**
   * Handle machine status message
   */
  async handleMachineStatus(machineId: string, payload: any) {
    try {
      const state = await this.getOrCreateMachineState(machineId);

      // Update state from payload
      const updatedState: MachineState = {
        ...state,
        ...payload,
        lastSeen: new Date(),
      };

      await this.redis.setMachineState(machineId, updatedState);

      // Fire machine.update event for WebSocket broadcast
      this.events.emit('machine.update', {
        machineId,
        state: updatedState,
      });

      // Fire-and-forget database write
      this.updateDeviceInDatabase(machineId, updatedState).catch((error: any) => {
        this.logger.error(
          `Error updating device in database: ${error?.message}`,
        );
      });
    } catch (error: any) {
      this.logger.error(`Error handling machine status: ${error?.message}`);
    }
  }

  /**
   * Handle raw data from machine
   */
  async handleRawData(machineId: string, payload: any) {
    try {
      const state = await this.getOrCreateMachineState(machineId);

      const updatedState: MachineState = {
        ...state,
        ...payload,
        lastSeen: new Date(),
      };

      // Update stop timer
      this.resetStopTimer(machineId);

      await this.redis.setMachineState(machineId, updatedState);

      // Emit events
      this.events.emit('machine.update', {
        machineId,
        state: updatedState,
      });

      if (payload.rollWeight) {
        this.events.emit('roll.complete', {
          machineId,
          weight: payload.rollWeight,
          timestamp: new Date(),
        });
      }
    } catch (error: any) {
      this.logger.error(`Error handling raw data: ${error?.message}`);
    }
  }

  /**
   * Handle problem alert
   */
  async handleProblem(machineId: string, payload: any) {
    try {
      const state = await this.getOrCreateMachineState(machineId);

      const updatedState: MachineState = {
        ...state,
        problemActive: true,
        ...payload,
        lastSeen: new Date(),
      };

      await this.redis.setMachineState(machineId, updatedState);

      // Emit alert event for Telegram to listen
      this.events.emit('alert.new', {
        machineId,
        type: 'problem',
        message: payload.problem || 'Unknown problem',
        timestamp: new Date(),
        state: updatedState,
      });

      // Log event to database (fire-and-forget)
      this.logEventToDatabase(
        machineId,
        'problem',
        payload.problem || 'Unknown problem',
      ).catch((error: any) => {
        this.logger.error(
          `Error logging event to database: ${error?.message}`,
        );
      });
    } catch (error: any) {
      this.logger.error(`Error handling problem: ${error?.message}`);
    }
  }

  /**
   * Handle problem resolved
   */
  async handleProblemResolved(machineId: string) {
    try {
      const state = await this.getOrCreateMachineState(machineId);

      const updatedState: MachineState = {
        ...state,
        problemActive: false,
        lastSeen: new Date(),
      };

      await this.redis.setMachineState(machineId, updatedState);

      this.events.emit('alert.resolved', {
        machineId,
        timestamp: new Date(),
      });

      this.logEventToDatabase(machineId, 'problem_resolved', 'Problem resolved')
        .catch((error: any) => {
          this.logger.error(
            `Error logging event to database: ${error?.message}`,
          );
        });
    } catch (error: any) {
      this.logger.error(`Error handling problem resolved: ${error?.message}`);
    }
  }

  /**
   * Get all machine summaries
   */
  async getAllMachineSummaries() {
    const states = await this.redis.getAllMachineStates();
    return Object.entries(states).map(([id, state]) => ({
      id,
      status: state.status,
      lastSeen: state.lastSeen,
      problemActive: state.problemActive || false,
      currentRoll: state.currentRoll,
      totalRollsToday: state.totalRollsToday || 0,
    }));
  }

  /**
   * Get machine details by ID
   */
  async getMachineDetails(machineId: string) {
    return this.redis.getMachineState(machineId);
  }

  /**
   * Reset stop timer for a machine
   */
  private resetStopTimer(machineId: string) {
    if (this.stopTimers.has(machineId)) {
      clearTimeout(this.stopTimers.get(machineId));
    }

    const timeout = setTimeout(() => {
      this.handleMachineStop(machineId);
      this.stopTimers.delete(machineId);
    }, STOP_TIMER_MS);

    this.stopTimers.set(machineId, timeout);
  }

  /**
   * Handle machine stop (when no data received for STOP_TIMER_MS)
   */
  private async handleMachineStop(machineId: string) {
    try {
      const state = await this.getOrCreateMachineState(machineId);
      const updatedState: MachineState = {
        ...state,
        status: 'stopped',
        lastSeen: new Date(),
      };

      await this.redis.setMachineState(machineId, updatedState);
      this.events.emit('machine.update', { machineId, state: updatedState });
    } catch (error: any) {
      this.logger.error(`Error handling machine stop: ${error?.message}`);
    }
  }

  /**
   * Update device in database (fire-and-forget)
   */
  private async updateDeviceInDatabase(machineId: string, state: MachineState) {
    await this.prisma.machine.upsert({
      where: { id: machineId },
      update: {
        status: state.status as 'online' | 'offline' | 'maintenance' | 'error',
        lastSeen: state.lastSeen,
      },
      create: {
        id: machineId,
        status: state.status as 'online' | 'offline' | 'maintenance' | 'error',
        lastSeen: state.lastSeen,
      } as any,
    });
  }

  /**
   * Log event to database (fire-and-forget)
   */
  private async logEventToDatabase(
    machineId: string,
    type: string,
    message: string,
  ) {
    await this.prisma.event.create({
      data: {
        machineId,
        type: type as any,
        data: { message },
        timestamp: new Date(),
      },
    });
  }
}
