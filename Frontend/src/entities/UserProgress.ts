import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsBoolean, IsNumber, Min, Max, IsUUID } from 'class-validator';
import { User } from './User';
import { Lesson } from './Lesson';

@Entity('user_progress')
export class UserProgress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  @IsUUID()
  userId!: string;

  @Column({ name: 'lesson_id', type: 'varchar', length: 36 })
  @IsUUID()
  lessonId!: string;

  @Column({ name: 'is_completed', type: 'boolean', default: false })
  @IsBoolean()
  isCompleted!: boolean;

  @Column({ name: 'progress_percentage', type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage!: number;

  @Column({ name: 'last_accessed', type: 'timestamp', nullable: true })
  lastAccessed?: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, user => user.progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Lesson, lesson => lesson.progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson!: Lesson;

  // Methods
  updateProgress(percentage: number): void {
    this.progressPercentage = Math.min(Math.max(percentage, 0), 100);
    this.lastAccessed = new Date();
    
    // Mark as completed if progress is 100%
    if (this.progressPercentage >= 100) {
      this.markAsCompleted();
    }
  }

  markAsCompleted(): void {
    this.isCompleted = true;
    this.progressPercentage = 100;
    this.completedAt = new Date();
    this.lastAccessed = new Date();
  }

  resetProgress(): void {
    this.isCompleted = false;
    this.progressPercentage = 0;
    this.completedAt = undefined;
    this.lastAccessed = new Date();
  }
}
