import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Product } from './Product';

@Entity()
export class Picture {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column()
    public filename: string;

    @ManyToOne((type) => Product, (product) => product.pictures)
    public product: Product;

    @Column()
    @CreateDateColumn()
    public createdAt: Date;

    @Column()
    @UpdateDateColumn()
    public updatedAt: Date;
}
