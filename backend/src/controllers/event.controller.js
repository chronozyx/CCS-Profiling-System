import pool from '../config/db.js';
import { parseId, requireString, requireDate, requireEnum, requireInt, sanitizeBody } from '../middlewares/sanitize.js';

const STATUSES = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];
const TYPES    = ['Seminar', 'Sports', 'Academic', 'Orientation', 'Competition', 'Social', 'Workshop', 'Other'];

export const getEvents = async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id,title,type,date,time,venue,faculty,participants,status,created_at FROM events ORDER BY date ASC'
    );
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Failed to fetch events' });
  }
};

export const getEventById = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const [rows] = await pool.query(
      'SELECT id,title,type,date,time,venue,faculty,participants,status,created_at FROM events WHERE id = ?', [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Event not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to fetch event' });
  }
};

export const createEvent = async (req, res) => {
  try {
    const b            = sanitizeBody(req.body);
    const title        = requireString(b.title,  'Title',  300);
    const type         = requireEnum(b.type,     'Type',   TYPES);
    const date         = requireDate(b.date);
    const status       = requireEnum(b.status || 'Upcoming', 'Status', STATUSES);
    const time         = b.time    ? requireString(b.time,    'Time',    20)  : '';
    const venue        = b.venue   ? requireString(b.venue,   'Venue',   200) : '';
    const faculty      = b.faculty ? requireString(b.faculty, 'Faculty', 200) : '';
    const participants = requireInt(b.participants ?? 0, 'Participants', 0, 100000);

    const [result] = await pool.query(
      'INSERT INTO events (title,type,date,time,venue,faculty,participants,status) VALUES (?,?,?,?,?,?,?,?)',
      [title, type, date, time, venue, faculty, participants, status]
    );
    const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to create event' });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const id           = parseId(req.params.id);
    const b            = sanitizeBody(req.body);
    const title        = requireString(b.title,  'Title',  300);
    const type         = requireEnum(b.type,     'Type',   TYPES);
    const date         = requireDate(b.date);
    const status       = requireEnum(b.status || 'Upcoming', 'Status', STATUSES);
    const time         = b.time    ? requireString(b.time,    'Time',    20)  : '';
    const venue        = b.venue   ? requireString(b.venue,   'Venue',   200) : '';
    const faculty      = b.faculty ? requireString(b.faculty, 'Faculty', 200) : '';
    const participants = requireInt(b.participants ?? 0, 'Participants', 0, 100000);

    const [result] = await pool.query(
      'UPDATE events SET title=?,type=?,date=?,time=?,venue=?,faculty=?,participants=?,status=? WHERE id=?',
      [title, type, date, time, venue, faculty, participants, status, id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Event not found' });
    const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to update event' });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const [result] = await pool.query('DELETE FROM events WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to delete event' });
  }
};
