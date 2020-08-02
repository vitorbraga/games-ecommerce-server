import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { Product } from './Product';

@Entity()
export class Type {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: number;

    @Column()
    price: string;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany((type: Type) => Type, (type) => type.parent, { cascade: true, eager: true })
    subTypes: Type[];

    @ManyToOne((type: Type) => Type, (type) => type.subTypes)
    parent: Type;

    @OneToMany((product: Product) => Product, (product) => product.type, { cascade: true, eager: true })
    products: Product[];
}
