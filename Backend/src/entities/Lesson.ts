import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { IsNotEmpty, Length, IsOptional, IsNumber, Min, IsIn, IsUrl, IsUUID } from 'class-validator';
import { Module } from './Module';
import { UserProgress } from './UserProgress';

export type ContentType = 'video' | 'article' | 'quiz' | 'assignment';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'module_id', type: 'varchar', length: 36 })
  @IsUUID()
  moduleId!: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  @Length(3, 255)
  title!: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  slug!: string;

  @Column({ 
    name: 'content_type',
    type: 'enum',
    enum: ['video', 'article', 'quiz', 'assignment'],
    default: 'video'
  })
  @IsIn(['video', 'article', 'quiz', 'assignment'])
  contentType!: ContentType;

  @Column({ name: 'content_url', type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsUrl()
  contentUrl?: string;

  @Column({ name: 'content_text', type: 'text', nullable: true })
  @IsOptional()
  contentText?: string;

  @Column({ type: 'int', nullable: true, comment: 'Duration in minutes' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  duration?: number;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  position!: number;

  @Column({ name: 'is_free', type: 'boolean', default: false })
  @IsOptional()
  isFree!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Module, module => module.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module!: Module;

  @OneToMany(() => UserProgress, progress => progress.lesson)
  progress?: UserProgress[];

  // Methods
  isCompleted(userId: string): boolean {
    if (!this.progress) return false;
    const userProgress = this.progress.find(p => p.userId === userId);
    return userProgress ? userProgress.isCompleted : false;
  }

  getProgressPercentage(userId: string): number {
    if (!this.progress) return 0;
    const userProgress = this.progress.find(p => p.userId === userId);
    return userProgress ? userProgress.progressPercentage : 0;
  }
}
