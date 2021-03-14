import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { Review } from './Review';
import { Picture } from './Picture';
import { Category } from './Category';
import { OrderItem } from './OrderItem';
import { IsNotEmpty } from 'class-validator';

@Entity()
export class Product {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column()
    @IsNotEmpty()
    public title: string;

    @Column()
    @IsNotEmpty()
    public description: string;

    @Column()
    public status: string;

    @Column()
    @IsNotEmpty()
    public price: number; // 5000 represents $50.00

    @Column({ nullable: true, type: 'float' })
    public discount?: number;

    @Column()
    public rating: number;

    @Column()
    public quantityInStock: number;

    @Column()
    // TODO For simplicity, we are currently using a comma-separated list as tags. We should create a ManyToMany relation between Product and Tags.
    // This new approach will make tags be reused. It requires proper implementation in admin-portal and many changes while fetching and showing products
    public tags: string;

    @Column('tsvector', { select: false })
    // eslint-disable-next-line camelcase
    public document_with_weights: any;

    @Column()
    @CreateDateColumn()
    public createdAt: Date;

    @Column()
    @UpdateDateColumn()
    public updatedAt: Date;

    @OneToMany((type) => Review, (review) => review.product, { cascade: true, eager: true })
    public reviews: Review[];

    @OneToMany((type) => Picture, (picture) => picture.product, { cascade: true, eager: true })
    public pictures: Picture[];

    @ManyToOne((type) => Category, (category) => category.products, { cascade: true, eager: true })
    public category: Category;

    @OneToMany((type) => OrderItem, (orderItem) => orderItem.product, { cascade: true })
    public orderItems!: OrderItem[];
}
