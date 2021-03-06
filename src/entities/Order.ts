import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, Index } from 'typeorm';
import { Address } from './Address';
import { OrderItem } from './OrderItem';
import { User } from './User';

@Entity()
export class Order {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Index({ unique: true })
    @Column()
    public orderNumber: string;

    @Column()
    public status: string;

    @Column()
    public shippingCosts: number;

    @Column()
    public total: number;

    @Column({ nullable: true })
    public coupon?: string;

    @Column()
    @CreateDateColumn()
    public createdAt: Date;

    @Column()
    @UpdateDateColumn()
    public updatedAt: Date;

    @OneToMany((type) => OrderItem, (orderItem) => orderItem.order, { cascade: true, eager: true })
    public orderItems!: OrderItem[];

    @ManyToOne((type) => User, (user) => user.orders, { eager: true })
    public user!: User | null;

    @ManyToOne((type) => Address, (address) => address.orders, { eager: true })
    public deliveryAddress!: Address;
}
