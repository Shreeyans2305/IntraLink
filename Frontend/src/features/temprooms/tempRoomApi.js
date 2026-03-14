const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function createTemporaryRoomApi(payload) {
  await wait(200)
  return {
    ok: true,
    ...payload,
  }
}

export async function extendTemporaryRoomApi(payload) {
  await wait(180)
  return {
    ok: true,
    ...payload,
  }
}