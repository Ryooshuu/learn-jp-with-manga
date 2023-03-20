import { IHasGuidId } from "./IHasGuidId";
import pool from "./PostgresPool";

type ValueChanged = {
    oldValue: any;
    newValue: any;
}

export class Transaction<TModel extends IHasGuidId> {
    private id!: string;
    private proxy: TModel | null = null;
    private changes: Map<string, ValueChanged> = new Map();
    
    StartTransaction(item: TModel) {
        if (this.proxy) {
            throw new Error("Cannot start a transaction when one is already in progress.");
        }

        this.id = item.id;
        
        this.proxy = new Proxy(item, {
            set: (target: any, prop: string, value: any) => {
                if (prop === "id") {
                    throw new Error("Cannot modify the id of a transaction.");
                }

                this.changes.set(prop, {
                    oldValue: target[prop],
                    newValue: value
                });
                
                target[prop] = value;
                return true;
            }
        });

        return this.proxy!;
    }

    async Commit(table: string) {
        if (!this.proxy) {
            throw new Error("Cannot commit a transaction that has not been started.");
        }

        this.proxy = null;
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            for (const [key, value] of this.changes.entries()) {
                await client.query(`UPDATE ${table} SET ${key} = $1 WHERE id = $2`, [value.newValue, this.id]);
            }
            
            await client.query("COMMIT");
        } catch (e) {
            await client.query("ROLLBACK");
            console.log("Failed to commit database transaction.");
            console.log("Infracting changes:");
            console.dir(this.changes, { depth: null });

            console.log(e);
        } finally {
            client.release();
        }

        return this.changes;
    }
}