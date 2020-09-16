import { IsNotEmpty } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Country } from './Country';
import { User } from './User';

@Entity()
export class Address {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column()
    @IsNotEmpty()
    public fullName: string;

    @Column()
    @IsNotEmpty()
    public line1: string;

    @Column({ nullable: true })
    public line2: string;

    @Column()
    @IsNotEmpty()
    public city: string;

    @Column()
    @IsNotEmpty()
    public zipCode: string;

    @ManyToOne((type) => Country, (country) => country.addresses, { eager: true })
    public country: Country;

    @Column({ nullable: true })
    public info: string;

    @Column()
    @CreateDateColumn()
    public createdAt: Date;

    @Column()
    @UpdateDateColumn()
    public updatedAt: Date;

    @ManyToOne((type) => User, (user) => user.addresses)
    public user: User;
}
