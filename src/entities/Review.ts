import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Product } from './Product';

@Entity()
export class Review {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column()
    public rating: number;

    @Column()
    public title: string;

    @Column()
    public description: string;

    @Column()
    @CreateDateColumn()
    public createdAt: Date;

    @Column()
    @UpdateDateColumn()
    public updatedAt: Date;

    @ManyToOne((type) => Product, (product) => product.reviews, { onDelete: 'CASCADE' })
    public product: Product;
}
