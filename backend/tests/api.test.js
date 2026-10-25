process.env.DB_PATH = ':memory:'; process.env.JWT_SECRET = 'test-secret';
const request = require('supertest'), app = require('../src/app'), db = require('../src/db'), bcrypt = require('bcryptjs');
let customer, administrator, vehicle;
beforeAll(async () => { await request(app).post('/api/auth/register').send({ name: 'Customer', email: 'c@example.com', password: 'password123' }); db.prepare('INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)').run('Admin', 'admin@example.com', bcrypt.hashSync('password123', 10), 'admin'); customer = (await request(app).post('/api/auth/login').send({ email: 'c@example.com', password: 'password123' })).body.token; administrator = (await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'password123' })).body.token });
test('requires authentication', async () => { expect((await request(app).get('/api/vehicles')).status).toBe(401) });
test('rejects invalid login', async () => { expect((await request(app).post('/api/auth/login').send({ email: 'c@example.com', password: 'wrong' })).status).toBe(401) });
test('customer cannot add cars', async () => { expect((await request(app).post('/api/vehicles').set('Authorization', 'Bearer ' + customer).send({ make: 'Toyota', model: 'Camry', category: 'Sedan', price: 10000, quantity: 2 })).status).toBe(403) });
test('admin adds, customer searches, purchases, stock cannot go below zero', async () => { const r = await request(app).post('/api/vehicles').set('Authorization', 'Bearer ' + administrator).send({ make: 'Toyota', model: 'Camry', category: 'Sedan', price: 10000, quantity: 1 }); expect(r.status).toBe(201); vehicle = r.body.id; const s = await request(app).get('/api/vehicles/search?make=toy').set('Authorization', 'Bearer ' + customer); expect(s.body).toHaveLength(1); const p = await request(app).post(`/api/vehicles/${vehicle}/purchase`).set('Authorization', 'Bearer ' + customer); expect(p.body.quantity).toBe(0); expect((await request(app).post(`/api/vehicles/${vehicle}/purchase`).set('Authorization', 'Bearer ' + customer)).status).toBe(409) });
test('admin restocks, updates, deletes', async () => { const h = { 'Authorization': 'Bearer ' + administrator }; expect((await request(app).post(`/api/vehicles/${vehicle}/restock`).set(h).send({ quantity: 3 })).body.quantity).toBe(3); expect((await request(app).put(`/api/vehicles/${vehicle}`).set(h).send({ price: 11000 })).body.price).toBe(11000); expect((await request(app).delete(`/api/vehicles/${vehicle}`).set(h)).status).toBe(204) });
test('admin cannot add a vehicle with negative price', async () => {
    const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', 'Bearer ' + administrator)
        .send({
            make: 'Toyota',
            model: 'Test Car',
            category: 'Sedan',
            price: -50000,
            quantity: 5
        });

    expect(response.status).toBe(400);
});

test('admin cannot add a vehicle with one character model', async () => {
    const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', 'Bearer ' + administrator)
        .send({
            make: 'Toyota',
            model: 'X',
            category: 'SUV',
            price: 2000000,
            quantity: 5
        });

    expect(response.status).toBe(400);
});