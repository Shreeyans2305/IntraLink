import { createSlice } from '@reduxjs/toolkit'

const durationMap = {
  '15m': 1000 * 60 * 15,
  '1h': 1000 * 60 * 60,
  '4h': 1000 * 60 * 60 * 4,
  '24h': 1000 * 60 * 60 * 24,
}

const parseDuration = (duration) => {
  if (!duration) {
    return durationMap['1h']
  }
  if (durationMap[duration]) {
    return durationMap[duration]
  }

  const value = Number.parseInt(duration, 10)
  if (duration.endsWith('m')) {
    return value * 60 * 1000
  }
  if (duration.endsWith('h')) {
    return value * 60 * 60 * 1000
  }
  return durationMap['1h']
}

const initialState = {
  rooms: [],
}

const tempRoomSlice = createSlice({
  name: 'temprooms',
  initialState,
  reducers: {
    setTempRooms: (state, action) => {
      state.rooms = action.payload || []
    },
    createTempRoom: (state, action) => {
      const { name, createdBy, duration } = action.payload
      const id = `temp-${Date.now()}`

      state.rooms.push({
        id,
        roomId: `room-${id}`,
        name,
        createdBy,
        expiresAt: Date.now() + parseDuration(duration),
        locked: false,
      })
    },
    extendTempRoom: (state, action) => {
      const { roomId, duration } = action.payload
      const target = state.rooms.find((room) => room.roomId === roomId)
      if (target) {
        target.expiresAt += parseDuration(duration)
        target.locked = false
      }
    },
    terminateTempRoom: (state, action) => {
      const roomId = action.payload
      const target = state.rooms.find((room) => room.roomId === roomId)
      if (target) {
        target.expiresAt = Date.now()
        target.locked = true
      }
    },
    expireRooms: (state) => {
      const now = Date.now()
      state.rooms = state.rooms.map((room) =>
        room.expiresAt <= now
          ? {
              ...room,
              locked: true,
            }
          : room,
      )
    },
  },
})

export const { createTempRoom, extendTempRoom, terminateTempRoom, expireRooms, setTempRooms } =
  tempRoomSlice.actions

export const selectTempRooms = (state) => state.temprooms.rooms

export default tempRoomSlice.reducer