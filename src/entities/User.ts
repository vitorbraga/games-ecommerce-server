import { Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, MinLength, IsEmail } from 'class-validator';
import * as argon2 from 'argon2';
import { PasswordReset } from './PasswordReset';
import { Address } from './Address';
import { Order } from './Order';
import logger from '../utils/logger';

@Entity()
@Unique(['email'])
export class User {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column()
    @IsEmail({}, { message: 'REGISTER_INVALID_EMAIL' })
    public email: string;

    @Column()
    @IsNotEmpty()
    public firstName: string;

    @Column()
    @IsNotEmpty()
    public lastName: string;

    @Column()
    @MinLength(6, { message: 'REGISTER_PASSWORD_SIX_CHARS' })
    public password: string;

    @Column()
    @IsNotEmpty()
    public role: string;

    @Column()
    @CreateDateColumn()
    public createdAt: Date;

    @Column()
    @UpdateDateColumn()
    public updatedAt: Date;

    @OneToMany((type) => PasswordReset, (passwordReset) => passwordReset.user, { cascade: true })
    public passwordResets: PasswordReset[];

    @OneToOne((type) => Address, { cascade: true })
    @JoinColumn()
    public mainAddress: Address | null;

    @OneToMany((type) => Address, (address) => address.user, { cascade: true })
    public addresses: Address[];

    @OneToMany((type) => Order, (order) => order.user)
    public orders!: Order[];

    async hashPassword(): Promise<void> {
        try {
            const hash = await argon2.hash(this.password);
            this.password = hash;
        } catch (error) {
            throw new Error(error);
        }
    }

    async checkIfUnencryptedPasswordIsValid(unencryptedPassword: string): Promise<boolean> {
        try {
            const isValid = await argon2.verify(this.password, unencryptedPassword);
            return isValid;
        } catch (error) {
            logger.error('Failed checking password.', error);
            return false;
        }
    }
}
