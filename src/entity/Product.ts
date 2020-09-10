import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { Review } from './Review';
import { Picture } from './Picture';
import { Category } from './Category';
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
    public tags: string; // because of simplicity and sqlite, using a comma-separated list as tags

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

    @OneToMany((type) => UserProduct, (userProduct) => userProduct.product)
    public userProducts!: UserProduct[];
}
