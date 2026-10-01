const { test, beforeEach, after, describe } = require('node:test')
const assert = require('node:assert')
const supertest = require('supertest')
const mongoose = require('mongoose')
const app = require('../app')
const api = supertest(app)

const helper = require('./test_helper')
const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

describe('Pruebas de la API de Blogs (4.8 - 4.12)', () => {

  test('blogs se devuelven como json y en la cantidad correcta', async () => {
    const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert.strictEqual(response.body.length, helper.initialBlogs.length)
  })

  test('la propiedad de identificador único se llama id', async () => {
    const response = await api.get('/api/blogs')
    const blogToView = response.body[0]

    assert.ok(blogToView.id)
    assert.strictEqual(blogToView._id, undefined)
  })

  test('se puede agregar un nuevo blog correctamente', async () => {
    const newBlog = {
      title: 'Async/Await es genial',
      author: 'Darling',
      url: 'https://fullstackopen.com/',
      likes: 10
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

    const titles = blogsAtEnd.map(b => b.title)
    assert.ok(titles.includes('Async/Await es genial'))
  })

  test('si falta la propiedad likes, por defecto será 0', async () => {
    const newBlogWithoutLikes = {
      title: 'Blog sin likes',
      author: 'Darling',
      url: 'https://ejemplo.com/'
    }

    const response = await api
      .post('/api/blogs')
      .send(newBlogWithoutLikes)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    assert.strictEqual(response.body.likes, 0)
  })

  test('si falta title o url responde con estado 400 Bad Request', async () => {
    const invalidBlog = {
      author: 'Anonimo',
      likes: 3
    }

    await api
      .post('/api/blogs')
      .send(invalidBlog)
      .expect(400)
  })
})

  test('eliminar un blog responde con estado 204 si el id es valido', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)

    const titles = blogsAtEnd.map(b => b.title)
    assert.ok(!titles.includes(blogToDelete.title))
  })

  test('actualizar los likes de un blog correctamente', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    const updatedData = {
      ...blogToUpdate,
      likes: blogToUpdate.likes + 10
    }

    const response = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedData)
      .expect(200)

    assert.strictEqual(response.body.likes, blogToUpdate.likes + 10)
  })


after(async () => {
  await mongoose.connection.close()
})