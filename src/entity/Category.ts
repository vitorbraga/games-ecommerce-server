import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, Tree, TreeChildren, TreeParent } from 'typeorm';
import { Product } from './Product';

@Entity()
@Tree("closure-table")
export class Category {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public key: string;

    @Column()
    public label: string;

    @Column()
    @CreateDateColumn()
    public createdAt: Date;

    @Column()
    @UpdateDateColumn()
    public updatedAt: Date;

    @TreeChildren()
    public subCategories: Category[];

    @TreeParent()
    public parent: Category;

    @OneToMany((product: Product) => Product, (product) => product.category)
    public products: Product[];
}
