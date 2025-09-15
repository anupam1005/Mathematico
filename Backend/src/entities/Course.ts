import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { IsNotEmpty, Length, IsOptional, IsNumber, IsBoolean, IsUUID } from 'class-validator';
import { User } from './User';
import { Module } from './Module';
import { Enrollment } from './Enrollment';

@Entity('courses')
export class Course {
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

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  thumbnailUrl?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @IsNumber()
  @IsOptional()
  price!: number;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  @IsBoolean()
  @IsOptional()
  isPublished!: boolean;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  @IsOptional()
  status!: string;

  @Column({ type: 'varchar', length: 50, default: 'Foundation' })
  @IsOptional()
  level!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  category!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  class!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  subject!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  duration!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  content!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  requirements!: string;

  @Column({ name: 'what_you_will_learn', type: 'json', nullable: true })
  @IsOptional()
  whatYouWillLearn!: string[];

  @Column({ name: 'who_is_this_for', type: 'json', nullable: true })
  @IsOptional()
  whoIsThisFor!: string[];

  @Column({ type: 'json', nullable: true })
  @IsOptional()
  topics!: string[];

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  @IsOptional()
  isFeatured!: boolean;

  @Column({ name: 'original_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  originalPrice!: number;

  @Column({ type: 'int', default: 0 })
  @IsOptional()
  students!: number;

  @Column({ name: 'created_by', type: 'varchar', length: 36 })
  @IsUUID()
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, user => user.courses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  instructor!: User;

  @OneToMany(() => Module, module => module.course, { cascade: true, eager: false })
  modules!: Module[];

  @OneToMany(() => Enrollment, enrollment => enrollment.course)
  enrollments!: Enrollment[];

  @ManyToMany(() => User, user => user.courses, { eager: false })
  @JoinTable({
    name: 'enrollments',
    joinColumn: {
      name: 'course_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  enrolledStudents!: User[];

  // Methods
  getTotalDuration(): number {
    if (!this.modules) return 0;
    return this.modules.reduce(
      (total, module) => total + (module.lessons?.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) || 0),
      0
    );
  }

  getTotalLessons(): number {
    if (!this.modules) return 0;
    return this.modules.reduce((total, module) => total + (module.lessons?.length || 0), 0);
  }

  getProgress(userId: string): number {
    if (!this.modules) return 0;
    const totalLessons = this.getTotalLessons();
    if (totalLessons === 0) return 0;
    
    const completedLessons = this.modules.reduce(
      (total, module) => total + module.getCompletedLessons(userId),
      0
    );
    
    return Math.round((completedLessons / totalLessons) * 100);
  }
}
