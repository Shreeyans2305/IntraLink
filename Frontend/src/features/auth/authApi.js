const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function loginApi({ email }) {
  await wait(350)
  const role = email.toLowerCase().includes('admin') ? 'admin' : 'user'

  return {
    token: 'intralink-demo-token',
    user: {
      id: 'u-1',
      name: email.split('@')[0],
      email,
      role,
    },
  }
}

export async function registerApi({ name, email }) {
  await wait(450)

  return {
    token: 'intralink-demo-token',
    user: {
      id: 'u-new',
      name,
      email,
      role: 'user',
    },
  }
}