import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ImageStatus {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum RejectionReason {
  FILE_TOO_SMALL = 'FILE_TOO_SMALL',
  RESOLUTION_TOO_SMALL = 'RESOLUTION_TOO_SMALL',
  INVALID_FORMAT = 'INVALID_FORMAT',
  DUPLICATE_IMAGE = 'DUPLICATE_IMAGE',
  BLURRY_IMAGE = 'BLURRY_IMAGE',
  NO_FACE_DETECTED = 'NO_FACE_DETECTED',
  FACE_TOO_SMALL = 'FACE_TOO_SMALL',
  MULTIPLE_FACES = 'MULTIPLE_FACES',
}

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  originalFilename!: string;

  @Column({ type: 'varchar' })
  mimeType!: string;

  @Column({ nullable: true, type: 'varchar' })
  cloudinaryPublicId!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  cloudinaryUrl!: string | null;

  @Column({ type: 'int', nullable: true })
  fileSizeBytes!: number | null;

  @Column({ type: 'int', nullable: true })
  width!: number | null;

  @Column({ type: 'int', nullable: true })
  height!: number | null;

  @Column({ nullable: true, type: 'varchar' })
  pHash!: string | null;

  @Column({ type: 'float', nullable: true })
  laplacianVariance!: number | null;

  @Column({ type: 'int', nullable: true })
  faceCount!: number | null;

  @Column({ type: 'float', nullable: true })
  faceAreaRatio!: number | null;

  @Column({ type: 'enum', enum: ImageStatus })
  status!: ImageStatus;

  @Column({ type: 'enum', enum: RejectionReason, nullable: true })
  rejectionReason!: RejectionReason | null;

  @Column({ nullable: true, type: 'varchar' })
  rejectionDetail!: string | null;

  @Column({ type: 'varchar', nullable: true })
  pipelineStatus!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
