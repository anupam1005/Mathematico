import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Course } from './Course';

export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DROPPED = 'dropped'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  FAILED = 'failed'
}

@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId!: string;

  @Column({ name: 'course_id', type: 'varchar', length: 36 })
  courseId!: string;

  @Column({ name: 'enrolled_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  enrolledAt!: Date;

  @Column({
    name: 'status',
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.ACTIVE
  })
  status!: EnrollmentStatus;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  paymentStatus!: PaymentStatus;

  @Column({ name: 'amount_paid', type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountPaid?: number;

  @Column({ name: 'amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount?: number;

  @Column({ name: 'payment_id', type: 'varchar', length: 255, nullable: true })
  paymentId?: string;

  @Column({ name: 'order_id', type: 'varchar', length: 255, nullable: true })
  orderId?: string;

  @Column({ name: 'payment_method', type: 'varchar', length: 50, nullable: true })
  paymentMethod?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, user => user.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Course, course => course.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  // Methods
  markAsCompleted() {
    this.status = EnrollmentStatus.COMPLETED;
  }

  markAsDropped() {
    this.status = EnrollmentStatus.DROPPED;
  }

  updatePaymentStatus(status: PaymentStatus, paymentId?: string) {
    this.paymentStatus = status;
    if (paymentId) {
      this.paymentId = paymentId;
    }
  }
}
