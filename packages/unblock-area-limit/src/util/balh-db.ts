const DB_NAME = 'balh';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | undefined
export function openDb() {
    return new Promise<IDBDatabase>((resolve, reject) => {
        var req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = function (evt) {
            resolve(this.result)
        }
        req.onerror = function (evt) {
            reject(evt)
        }

        req.onupgradeneeded = (evt: IDBVersionChangeEvent) => {
            var storeEPIDCache = (evt.currentTarget as IDBOpenDBRequest)?.result.createObjectStore(
                'ep_id_season_id', { keyPath: 'ep_id' })
            storeEPIDCache.createIndex('season_id', 'season_id', { unique: false })
        }
    })
}

function getDb() {
    return dbPromise ??= openDb()
}

async function getObjectStore(store_name: string, mode: IDBTransactionMode) {
    const db = await getDb()
    var tx = db.transaction(store_name, mode);
    return tx.objectStore(store_name);
}

export namespace BalhDb {
    export async function setSsId(ep_id: number, season_id: string) {
        var store = await getObjectStore('ep_id_season_id', 'readwrite')
        store.put({ ep_id: ep_id, season_id: season_id })
    }

    export function getSsId(ep_id: number): Promise<string> {
        return new Promise(async (resolve, reject) => {
            var store = await getObjectStore('ep_id_season_id', 'readonly');
            var req: IDBRequest = store.get(ep_id)
            req.onsuccess = () => {
                if (!req.result)
                    resolve('')
                else
                    resolve(req.result.season_id)
            }
            req.onerror = (e) => {
                reject(e)
            }
        })
    }
}
