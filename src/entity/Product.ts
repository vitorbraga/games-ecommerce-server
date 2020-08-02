import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { Review } from './Review';
import { Picture } from './Picture';
import { Type } from './Type';
import { ProductStatus } from './model';
import { UserProduct } from './UserProduct';

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public title: string;

    @Column()
    public description: string;

    @Column()
    // FIXME ProductStatus, sqlite doesnt support enum
    public status: string;

    @Column()
    public price: number; // 5000 represents $50.00

    @Column({ nullable: true, type: 'float' })
    public discount: number;

    @Column()
    public rating: number;

    @Column()
    public quantityInStock: number;

    @Column()
    public tags: string; // comma-separated list

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

    @ManyToOne((type) => Type, (type) => type.products)
    public type: Type;

    @OneToMany((type) => UserProduct, (userProduct) => userProduct.product)
    public userProducts!: UserProduct[];
}
