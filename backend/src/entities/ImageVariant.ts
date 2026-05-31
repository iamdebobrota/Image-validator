import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum VariantType {
  THUMBNAIL = 'thumbnail',
  WEB = 'web',
  FULL = 'full',
}

@Entity('image_variants')
export class ImageVariant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  imageId!: string;

  @Column({ type: 'enum', enum: VariantType })
  variantType!: VariantType;

  @Column({ type: 'int' })
  width!: number;

  @Column({ type: 'int' })
  height!: number;

  @Column({ type: 'int' })
  fileSizeBytes!: number;

  @Column({ type: 'varchar' })
  cloudinaryPublicId!: string;

  @Column({ type: 'varchar' })
  cloudinaryUrl!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
