import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductSearchDocument1601405935825 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            update product set document_with_weights = setweight(to_tsvector('title'), 'A') || setweight(to_tsvector(description), 'B') || setweight(to_tsvector(coalesce(tags, '')), 'C');
            CREATE INDEX document_weights_idx ON product USING GIN (document_with_weights);
            CREATE FUNCTION product_tsvector_trigger() RETURNS trigger AS $$
            begin
                new.document_with_weights :=
                setweight(to_tsvector('english', coalesce(new.title, '')), 'A')
                || setweight(to_tsvector('english', coalesce(new.description, '')), 'B')
                || setweight(to_tsvector('english', coalesce(new.tags, '')), 'C');
                return new;
            end
            $$ LANGUAGE plpgsql;
            CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE ON product FOR EACH ROW EXECUTE PROCEDURE product_tsvector_trigger();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('ProductSearchDocument down.');
    }
}
