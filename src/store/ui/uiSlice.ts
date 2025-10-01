import { createSlice, type PayloadAction } from '@reduxjs/toolkit'


const initialState = { loading:false, error: null as string | null }


const slice = createSlice({
name: 'ui',
initialState,
reducers: {
setLoading(state, action: PayloadAction<boolean>){ state.loading = action.payload },
setError(state, action: PayloadAction<string | null>){ state.error = action.payload }
}
})


export const { setLoading, setError } = slice.actions
export default slice.reducer