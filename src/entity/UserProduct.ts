import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Product } from './Product';

@Entity()
export class UserProduct {
    @PrimaryGeneratedColumn('uuid')
    public id!: string;

    @Column()
    public userId!: string;

    @Column()
    // FIXME UserProductStatus, sqlite doesnt support enum
    public status: string;

    @Column()
    @CreateDateColumn()
    public createdAt: Date;

    @Column()
    @UpdateDateColumn()
    public updatedAt: Date;

    @ManyToOne((type) => User, (user) => user.userProducts)
    public user!: User;

    @ManyToOne((type) => Product, (product) => product.userProducts)
    public product!: Product;
}
