import { Request, Response } from 'express';
import { Contact } from '../models/Contact';

// Public endpoint for submitting contact forms
export const submitContact = async (req: Request, res: Response) => {
  try {
    const contact = await Contact.create(req.body);
    res.status(201).json({ message: 'Message sent successfully. We will be in touch shortly.' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to submit contact form. Please check your data.' });
  }
};

// Admin endpoint: Get all contacts
export const getContacts = async (req: Request, res: Response) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin endpoint: Update contact status
export const updateContactStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (error) {
    res.status(400).json({ error: 'Invalid data' });
  }
};

// Admin endpoint: Delete contact
export const deleteContact = async (req: Request, res: Response) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
