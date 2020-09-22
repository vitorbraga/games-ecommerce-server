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
    // FIXME OrderStatus, sqlite doesnt support enum
    public status: string;

    @Column()
    public deliveryFee: number;

    @Column()
    public total: number;

    @Column({ nullable: true })
    public coupon: string;

    @Column()
    @CreateDateColumn()
    public createdAt: Date;

    @Column()
    @UpdateDateColumn()
    public updatedAt: Date;

    @OneToMany((type) => OrderItem, (orderItem) => orderItem.order, { cascade: true })
    public orderItems!: OrderItem[];

    @ManyToOne((type) => User, (user) => user.orders)
    public user!: User;

    @ManyToOne((type) => Address, (address) => address.orders)
    public deliveryAddress!: Address;
}
