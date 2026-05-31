import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PipelineStatus {
  PENDING = 'pending',
  CONVERTING = 'converting',
  COMPRESSING = 'compressing',
  GENERATING_VARIANTS = 'generating_variants',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('processing_jobs')
export class ProcessingJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  imageId!: string;

  @Column({ type: 'enum', enum: PipelineStatus, default: PipelineStatus.PENDING })
  status!: PipelineStatus;

  @Column({ type: 'varchar', nullable: true })
  currentStep!: string | null;

  @Column({ type: 'varchar', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'int', nullable: true })
  originalSizeBytes!: number | null;

  @Column({ type: 'int', nullable: true })
  compressedSizeBytes!: number | null;

  @Column({ type: 'float', nullable: true })
  compressionRatio!: number | null;

  @Column({ type: 'int', default: 0 })
  attemptCount!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
