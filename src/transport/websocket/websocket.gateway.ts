import {
  Injectable,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';
import { SensorsService } from '@/modules/sensors/sensors.service';
import { TelemetryService } from '@/modules/telemetry/telemetry.service';
import { AppLoggerService } from '@/common/logger/logger.service';
import * as WebSocket from 'ws';
import * as http from 'http';

@Injectable()
export class AppWebSocketGateway implements OnApplicationBootstrap {
  private wss!: WebSocket.Server;
  private logger = new Logger(AppWebSocketGateway.name);
  private connectedClients = new Set<WebSocket.WebSocket>();
  private httpServer!: http.Server;

  constructor(
    private sensorsService: SensorsService,
    private telemetryService: TelemetryService,
    private appLogger: AppLoggerService,
  ) {}

  onApplicationBootstrap() {
    try {
      // Create a simple HTTP server for WebSocket
      this.httpServer = http.createServer();
      this.wss = new WebSocket.Server({ server: this.httpServer });

      this.wss.on('connection', (ws: WebSocket.WebSocket) => {
        this.handleConnection(ws);
      });

      // Listen on a separate port for WebSocket (8080)
      this.httpServer.listen(8080, () => {
        this.logger.log('✅ WebSocket server listening on port 8080');
      });
    } catch (error: any) {
      this.logger.error(`Error setting up WebSocket server: ${error?.message}`);
    }
  }

  /**
   * Handle WebSocket connection
   */
  private async handleConnection(ws: WebSocket.WebSocket) {
    try {
      this.connectedClients.add(ws);
      this.logger.log(`WebSocket client connected. Total: ${this.connectedClients.size}`);

      // Send init data to client
      const machines = await this.sensorsService.getAllMachineSummaries();
      const kpis = await this.telemetryService.getAllKpiSnapshots();

      this.sendToClient(ws, 'init', {
        machines,
        kpis,
        timestamp: new Date(),
      });

      // Handle disconnection
      ws.on('close', () => {
        this.connectedClients.delete(ws);
        this.logger.log(`WebSocket client disconnected. Total: ${this.connectedClients.size}`);
      });

      // Handle errors
      ws.on('error', (error: any) => {
        this.logger.error(`WebSocket error: ${error?.message}`);
      });
    } catch (error: any) {
      this.logger.error(`Error handling connection: ${error?.message}`);
      ws.close();
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(type: string, payload: any) {
    const message = JSON.stringify({ type, payload, timestamp: new Date() });

    this.connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * Send message to specific client
   */
  private sendToClient(ws: WebSocket.WebSocket, type: string, payload: any) {
    try {
      const message = JSON.stringify({ type, payload, timestamp: new Date() });
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    } catch (error: any) {
      this.logger.error(`Error sending to client: ${error?.message}`);
    }
  }

  /**
   * Listen for machine update events
   */
  @OnEvent('machine.update')
  handleMachineUpdate(data: any) {
    this.broadcast('machine_update', data);
  }

  /**
   * Listen for alert events
   */
  @OnEvent('alert.new')
  handleAlertNew(data: any) {
    this.broadcast('alert_new', data);
  }

  /**
   * Listen for roll complete events
   */
  @OnEvent('roll.complete')
  handleRollComplete(data: any) {
    this.broadcast('roll_complete', data);
  }

  /**
   * Listen for alert resolved events
   */
  @OnEvent('alert.resolved')
  handleAlertResolved(data: any) {
    this.broadcast('alert_resolved', data);
  }
}
