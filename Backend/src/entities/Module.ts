import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsNotEmpty, Length, IsOptional, IsNumber, Min, IsUUID } from 'class-validator';
import { Course } from './Course';
import { Lesson } from './Lesson';

@Entity('modules')
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'course_id', type: 'varchar', length: 36 })
  @IsUUID()
  courseId!: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  @Length(3, 255)
  title!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  description?: string;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  position!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Course, course => course.modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  @OneToMany(() => Lesson, lesson => lesson.module, { cascade: true, eager: true })
  lessons!: Lesson[];

  // Methods
  getDuration(): number {
    if (!this.lessons) return 0;
    return this.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
  }

  getCompletedLessons(userId: string): number {
    if (!this.lessons) return 0;
    return this.lessons.filter(lesson => 
      lesson.progress?.some(p => p.userId === userId && p.isCompleted)
    ).length;
  }
}
