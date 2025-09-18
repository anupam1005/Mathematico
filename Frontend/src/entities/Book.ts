import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, Length, IsOptional, IsNumber, IsBoolean, IsUUID } from 'class-validator';
import { User } from './User';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  @Length(5, 255)
  title!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @IsNotEmpty()
  slug!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  author?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  publisher?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  category?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  subject?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  class?: string;

  @Column({ type: 'varchar', length: 50, default: 'Foundation' })
  @IsOptional()
  level?: string;

  @Column({ name: 'cover_image_url', type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  coverImageUrl?: string;

  @Column({ name: 'pdf_url', type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  pdfUrl?: string;

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  pages?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  isbn?: string;


  @Column({ type: 'varchar', length: 50, default: 'draft' })
  @IsOptional()
  status!: string;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  @IsOptional()
  @IsBoolean()
  isPublished!: boolean;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured!: boolean;

  @Column({ type: 'int', default: 0 })
  @IsOptional()
  @IsNumber()
  downloads!: number;

  @Column({ type: 'json', nullable: true })
  @IsOptional()
  tags?: string[];

  @Column({ name: 'table_of_contents', type: 'text', nullable: true })
  @IsOptional()
  tableOfContents?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  summary?: string;

  @Column({ name: 'created_by', type: 'varchar', length: 36 })
  @IsUUID()
  createdBy!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  creator!: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
