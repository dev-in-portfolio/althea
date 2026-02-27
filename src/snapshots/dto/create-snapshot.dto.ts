import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateSnapshotDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2_000_000)
  body!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  summary?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  diffAdded?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  diffRemoved?: number;
}
