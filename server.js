const express = require('express');
const path = require('node:path');

const app = express();
const students = [];
let nextId = 1;

app.use(express.json());
app.use('/app', express.static(path.join(__dirname, 'public')));

function validateStudent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return 'Request body must be a JSON object';
  }
  if (typeof input.name !== 'string' || input.name.trim() === '') {
    return 'Name cannot be empty';
  }
  if (
    typeof input.email !== 'string' ||
    input.email.trim() === '' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())
  ) {
    return 'Email must be a valid email address';
  }
  if (typeof input.course !== 'string' || input.course.trim() === '') {
    return 'Course cannot be empty';
  }
  if (typeof input.age !== 'number' || !Number.isFinite(input.age) || input.age <= 0) {
    return 'Age must be a positive number';
  }
  return null;
}

function studentFrom(input, id) {
  return {
    id,
    name: input.name.trim(),
    email: input.email.trim(),
    course: input.course.trim(),
    age: input.age,
  };
}

function findStudent(id) {
  return students.find((student) => student.id === Number(id));
}

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Student Management API is running' });
});

app.post('/students', (req, res) => {
  const validationError = validateStudent(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const student = studentFrom(req.body, nextId++);
  students.push(student);
  return res.status(201).json(student);
});

app.get('/students', (req, res) => res.status(200).json(students));

app.get('/students/search', (req, res) => {
  const course = typeof req.query.course === 'string' ? req.query.course.trim() : '';
  if (course === '') {
    return res.status(400).json({ error: 'Course query parameter is required' });
  }

  return res.status(200).json(
    students.filter((student) => student.course.toLowerCase() === course.toLowerCase()),
  );
});

app.get('/students/:id', (req, res) => {
  const student = findStudent(req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  return res.status(200).json(student);
});

app.put('/students/:id', (req, res) => {
  const student = findStudent(req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const validationError = validateStudent(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  Object.assign(student, studentFrom(req.body, student.id));
  return res.status(200).json(student);
});

app.delete('/students/:id', (req, res) => {
  const index = students.findIndex((student) => student.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }

  students.splice(index, 1);
  return res.status(200).json({ message: 'Student deleted successfully' });
});

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must contain valid JSON' });
  }
  return res.status(error.status || 500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Student API listening on port ${port}`);
  });
}

module.exports = { app, students };