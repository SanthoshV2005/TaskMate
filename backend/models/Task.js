const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters long'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Task description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters long']
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium',
        required: true
    },
    status: {
        type: String,
        enum: ['To-Do', 'In Progress', 'Done'],
        default: 'To-Do',
        required: true
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required'],
        validate: {
            validator: function(value) {
                // Allow past dates for existing tasks, but validate for new ones
                if (this.isNew) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return value >= today;
                }
                return true;
            },
            message: 'Due date cannot be in the past'
        }
    },
    // AUTOMATION FIELDS
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', null],
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
taskSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Add index for faster queries
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, dueDate: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;