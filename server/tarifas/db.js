import Datastore from 'nedb-promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = process.env.TARIFAS_DB_DIR
  ? path.resolve(process.env.TARIFAS_DB_DIR)
  : path.resolve(__dirname, '../db');

export const dbZonas = Datastore.create({
  filename: path.join(dbDir, 'zonas.db'),
  autoload: true
});

export const dbHoteles = Datastore.create({
  filename: path.join(dbDir, 'hoteles.db'),
  autoload: true
});

export const dbLugares = Datastore.create({
  filename: path.join(dbDir, 'lugares.db'),
  autoload: true
});

export const dbTarifarios = Datastore.create({
  filename: path.join(dbDir, 'tarifarios.db'),
  autoload: true
});

export const dbTours = Datastore.create({
  filename: path.join(dbDir, 'tours.db'),
  autoload: true
});

// Autocompactación periódica cada hora
[dbZonas, dbHoteles, dbLugares, dbTarifarios, dbTours].forEach(ds => {
  if (typeof ds.setAutocompactionInterval === 'function') {
    ds.setAutocompactionInterval(1000 * 60 * 60);
  } else if (ds.persistence && typeof ds.persistence.setAutocompactionInterval === 'function') {
    ds.persistence.setAutocompactionInterval(1000 * 60 * 60);
  }
});
