import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class QueryEventsDto {
  @IsOptional()
  @IsString()
  machineId?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 100;
}

export class QuerySnapshotDto {
  @IsOptional()
  @IsString()
  machineId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 100;
}
