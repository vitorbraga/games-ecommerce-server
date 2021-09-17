import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Product } from './Product';
import { User } from './User';

@Entity()
export class Review {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column({ nullable: true, type: 'float' })
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

    @ManyToOne((type) => User, (product) => product.reviews, { onDelete: 'CASCADE' })
    public user: User;
}
