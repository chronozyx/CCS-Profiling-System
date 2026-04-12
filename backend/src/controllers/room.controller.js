import pool from '../config/db.js';
import { parseId, requireString, requireEnum, requireInt, sanitizeBody } from '../middlewares/sanitize.js';

const ROOM_TYPES = ['LECTURE_ROOM', 'LABORATORY_ROOM'];
const STATUSES   = ['Available', 'Occupied', 'Under Maintenance'];

export const getRooms = async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id,room_id,name,type,building,floor,capacity,current_occupancy,status FROM rooms ORDER BY name'
    );
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Failed to fetch rooms' });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const [rows] = await pool.query(
      'SELECT id,room_id,name,type,building,floor,capacity,current_occupancy,status FROM rooms WHERE id = ?', [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Room not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to fetch room' });
  }
};

export const createRoom = async (req, res) => {
  try {
    const b                 = sanitizeBody(req.body);
    const room_id           = requireString(b.room_id, 'Room ID', 20);
    const name              = requireString(b.name,    'Name',    200);
    const type              = requireEnum(b.type,      'Type',    ROOM_TYPES);
    const status            = requireEnum(b.status || 'Available', 'Status', STATUSES);
    const capacity          = requireInt(b.capacity,          'Capacity',          1, 1000);
    const current_occupancy = requireInt(b.current_occupancy ?? 0, 'Current occupancy', 0, 1000);
    const building          = b.building ? requireString(b.building, 'Building', 100) : '';
    const floor             = b.floor    ? requireString(b.floor,    'Floor',    20)  : '';

    if (current_occupancy > capacity)
      return res.status(400).json({ message: 'Current occupancy cannot exceed capacity' });

    const [result] = await pool.query(
      'INSERT INTO rooms (room_id,name,type,building,floor,capacity,current_occupancy,status) VALUES (?,?,?,?,?,?,?,?)',
      [room_id, name, type, building, floor, capacity, current_occupancy, status]
    );
    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ message: 'Room ID already exists' });
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to create room' });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const id                = parseId(req.params.id);
    const b                 = sanitizeBody(req.body);
    const name              = requireString(b.name, 'Name', 200);
    const type              = requireEnum(b.type,   'Type', ROOM_TYPES);
    const status            = requireEnum(b.status || 'Available', 'Status', STATUSES);
    const capacity          = requireInt(b.capacity,          'Capacity',          1, 1000);
    const current_occupancy = requireInt(b.current_occupancy ?? 0, 'Current occupancy', 0, 1000);
    const building          = b.building ? requireString(b.building, 'Building', 100) : '';
    const floor             = b.floor    ? requireString(b.floor,    'Floor',    20)  : '';

    if (current_occupancy > capacity)
      return res.status(400).json({ message: 'Current occupancy cannot exceed capacity' });

    const [result] = await pool.query(
      'UPDATE rooms SET name=?,type=?,building=?,floor=?,capacity=?,current_occupancy=?,status=? WHERE id=?',
      [name, type, building, floor, capacity, current_occupancy, status, id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Room not found' });
    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to update room' });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const [result] = await pool.query('DELETE FROM rooms WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to delete room' });
  }
};
