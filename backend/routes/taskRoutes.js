// ========================================
// Task Routes - CRUD Operations
// ========================================
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// ========================================
// @route   GET /api/tasks
// @desc    Get all tasks for logged-in user
// @access  Private
// ========================================
router.get('/', auth, async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.userId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: tasks.length,
            tasks
        });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tasks',
            error: error.message
        });
    }
});

// ========================================
// @route   GET /api/tasks/stats
// @desc    Get task statistics
// @access  Private
// ========================================
router.get('/stats', auth, async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.userId });

        const stats = {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            inProgress: tasks.filter(t => t.status === 'in-progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            high: tasks.filter(t => t.priority === 'high').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            low: tasks.filter(t => t.priority === 'low').length
        };

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

// ========================================
// @route   GET /api/tasks/:id
// @desc    Get single task by ID
// @access  Private
// ========================================
router.get('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.userId
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.json({
            success: true,
            task
        });
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching task',
            error: error.message
        });
    }
});

// ========================================
// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
// ========================================
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, priority, dueDate, status } = req.body;

        // Validate required fields
        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Task title is required'
            });
        }

        // Create task
        const task = new Task({
            title: title.trim(),
            description: description?.trim() || '',
            priority: priority || 'medium',
            dueDate: dueDate || null,
            status: status || 'pending',
            user: req.userId
        });

        await task.save();

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            task
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating task',
            error: error.message
        });
    }
});

// ========================================
// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
// ========================================
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, description, priority, dueDate, status } = req.body;

        // Find task
        let task = await Task.findOne({
            _id: req.params.id,
            user: req.userId
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Validate title if provided
        if (title !== undefined && !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Task title cannot be empty'
            });
        }

        // Update fields
        if (title !== undefined) task.title = title.trim();
        if (description !== undefined) task.description = description.trim();
        if (priority !== undefined) task.priority = priority;
        if (dueDate !== undefined) task.dueDate = dueDate;
        if (status !== undefined) task.status = status;

        await task.save();

        res.json({
            success: true,
            message: 'Task updated successfully',
            task
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating task',
            error: error.message
        });
    }
});

// ========================================
// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
// ========================================
router.delete('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            user: req.userId
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting task',
            error: error.message
        });
    }
});

module.exports = router;