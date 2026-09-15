# Student Management REST API

## Setup

```bash
npm install
npm start
```

The API listens on `http://localhost:3000` by default. Set `PORT` to use another port.

## Endpoints

- `POST /students` creates a student.
- `GET /students` lists all students.
- `GET /students/:id` returns one student.
- `PUT /students/:id` updates a student.
- `DELETE /students/:id` deletes a student.
- `GET /students/search?course=Computing` searches by course.

Run the automated API tests with:

```bash
npm test
```
