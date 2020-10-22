import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Order } from './Order';
import { Product } from './Product';

@Entity()
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column()
    public quantity: number;

    @Column()
    @CreateDateColumn()
    public createdAt: Date;

    @Column()
    @UpdateDateColumn()
    public updatedAt: Date;

    @ManyToOne((type) => Product, (product) => product.orderItems, { eager: true })
    public product!: Product;

    @ManyToOne((type) => Order, (order) => order.orderItems)
    public order!: Order;
}
