const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchThreadApi(parentId) {
  await wait(120)
  return {
    parentId,
    items: [],
  }
}