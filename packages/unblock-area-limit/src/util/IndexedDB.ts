const DB_NAME = 'balh';
const DB_VERSION = 1;

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

export function getObjectStore(db: IDBDatabase, store_name: string, mode: IDBTransactionMode) {
    var tx = db.transaction(store_name, mode);
    return tx.objectStore(store_name);
}

async function clearObjectStore(store_name: string) {
    var store = getObjectStore(await openDb(), store_name, 'readwrite');
    var req = store.clear()
    req.onerror = function (evt) {
        console.error("clearObjectStore:", evt);
    }
}

export function getBlob(key: any, store: IDBObjectStore, success_callback: (blob: Blob) => void) {
    var req: IDBRequest = store.get(key)
    req.onsuccess = async function (evt) {
        var value = (evt.target as IDBRequest)?.result
        if (value)
            success_callback(value)
    }
}

export function getSsId(ep_id: number): Promise<string> {
    return new Promise(async (resolve, reject) => {
        var store = getObjectStore(await openDb(), 'ep_id_season_id', 'readonly');
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
