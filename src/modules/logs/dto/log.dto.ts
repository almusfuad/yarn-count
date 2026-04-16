import { IsString, IsNumber, IsOptional } from 'class-validator';

export class LogDowntimeDto {
  @IsString()
  machineId!: string;

  @IsString()
  reason!: string;

  @IsNumber()
  duration!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class LogQualityDto {
  @IsString()
  machineId!: string;

  @IsString()
  status!: string;

  @IsNumber()
  @IsOptional()
  defects?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class LogRollWeightDto {
  @IsString()
  machineId!: string;

  @IsNumber()
  weight!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AcknowledgeAlertDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
