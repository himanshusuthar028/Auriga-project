const form = document.querySelector('#studentForm');
const rows = document.querySelector('#studentRows');
const formMessage = document.querySelector('#formMessage');
const listMessage = document.querySelector('#listMessage');
const searchInput = document.querySelector('#searchInput');
const cancelEdit = document.querySelector('#cancelEdit');
let students = [];
let editingId = null;

async function request(path, options = {}) {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Something went wrong');
  return body;
}

function showMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle('error', isError);
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const visible = query ? students.filter((student) => student.course.toLowerCase().includes(query)) : students;
  rows.innerHTML = visible.map((student) => `
    <tr>
      <td><strong>${escapeHtml(student.name)}</strong><small>${escapeHtml(student.email)}</small></td>
      <td>${escapeHtml(student.course)}</td><td>${student.age}</td>
      <td><button class="action-button" data-action="edit" data-id="${student.id}">Edit</button><button class="action-button delete" data-action="delete" data-id="${student.id}">Delete</button></td>
    </tr>`).join('');
  listMessage.textContent = visible.length ? `${visible.length} student${visible.length === 1 ? '' : 's'} found` : 'No students found. Add the first record using the form.';
  document.querySelector('#totalStudents').textContent = students.length;
  document.querySelector('#totalCourses').textContent = new Set(students.map((student) => student.course.toLowerCase())).size;
  document.querySelector('#showingStudents').textContent = visible.length;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

async function loadStudents() {
  try { students = await request('/students'); render(); } catch (error) { showMessage(listMessage, error.message, true); }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  data.age = Number(data.age);
  try {
    const path = editingId ? `/students/${editingId}` : '/students';
    const saved = await request(path, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(data) });
    if (editingId) students = students.map((student) => student.id === editingId ? saved : student);
    else students.push(saved);
    resetForm(); render(); showMessage(formMessage, editingId ? 'Student updated successfully.' : 'Student added successfully.');
  } catch (error) { showMessage(formMessage, error.message, true); }
});

rows.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const id = Number(button.dataset.id);
  const student = students.find((item) => item.id === id);
  if (button.dataset.action === 'edit') {
    editingId = id; form.name.value = student.name; form.email.value = student.email; form.course.value = student.course; form.age.value = student.age;
    document.querySelector('#formTitle').textContent = 'Edit student'; document.querySelector('#submitLabel').textContent = 'Save changes'; cancelEdit.classList.remove('hidden'); form.name.focus();
  } else if (confirm(`Delete ${student.name}?`)) {
    try { await request(`/students/${id}`, { method: 'DELETE' }); students = students.filter((item) => item.id !== id); render(); showMessage(formMessage, 'Student deleted.'); } catch (error) { showMessage(formMessage, error.message, true); }
  }
});

function resetForm() { editingId = null; form.reset(); document.querySelector('#formTitle').textContent = 'Add a student'; document.querySelector('#submitLabel').textContent = 'Add student'; cancelEdit.classList.add('hidden'); }
cancelEdit.addEventListener('click', resetForm);
searchInput.addEventListener('input', render);
document.querySelector('#clearSearch').addEventListener('click', () => { searchInput.value = ''; render(); });
loadStudents();
