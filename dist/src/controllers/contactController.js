"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteContact = exports.updateContactStatus = exports.getContacts = exports.submitContact = void 0;
const Contact_1 = require("../models/Contact");
// Public endpoint for submitting contact forms
const submitContact = async (req, res) => {
    try {
        const contact = await Contact_1.Contact.create(req.body);
        res.status(201).json({ message: 'Message sent successfully. We will be in touch shortly.' });
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to submit contact form. Please check your data.' });
    }
};
exports.submitContact = submitContact;
// Admin endpoint: Get all contacts
const getContacts = async (req, res) => {
    try {
        const contacts = await Contact_1.Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getContacts = getContacts;
// Admin endpoint: Update contact status
const updateContactStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const contact = await Contact_1.Contact.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!contact)
            return res.status(404).json({ error: 'Contact not found' });
        res.json(contact);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid data' });
    }
};
exports.updateContactStatus = updateContactStatus;
// Admin endpoint: Delete contact
const deleteContact = async (req, res) => {
    try {
        const contact = await Contact_1.Contact.findByIdAndDelete(req.params.id);
        if (!contact)
            return res.status(404).json({ error: 'Contact not found' });
        res.json({ message: 'Contact deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.deleteContact = deleteContact;
