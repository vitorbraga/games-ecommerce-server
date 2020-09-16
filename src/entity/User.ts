import { Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, MinLength, IsEmail } from 'class-validator';
import * as argon2 from 'argon2';
import { PasswordReset } from './PasswordReset';
import { UserProduct } from './UserProduct';
import { Address } from './Address';

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
    public mainAddress: Address;

    @OneToMany((type) => Address, (address) => address.user, { cascade: true })
    public addresses: Address[];

    @OneToMany((type) => UserProduct, (userProduct) => userProduct.user)
    public userProducts!: UserProduct[];

    async hashPassword(): Promise<void> {
        const hash = await argon2.hash(this.password);
        this.password = hash;
    }

    async checkIfUnencryptedPasswordIsValid(unencryptedPassword: string): Promise<boolean> {
        try {
            const isValid = await argon2.verify(this.password, unencryptedPassword);
            return isValid;
        } catch (err) {
            console.log('Failed checking password.', err);
            return false;
        }
    }
}
