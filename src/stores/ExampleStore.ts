import { makeAutoObservable, runInAction } from 'mobx'
import { supabase } from '@/lib/supabase'

interface ExampleData {
  id?: number
  name: string
  created_at?: string
}

class ExampleStore {
  data: ExampleData[] = []
  loading = false
  error: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  async fetchData() {
    this.loading = true
    this.error = null

    try {
      const { data, error } = await supabase
        .from('examples')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      runInAction(() => {
        this.data = data || []
        this.loading = false
      })
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        this.loading = false
      })
    }
  }

  async createData(name: string) {
    this.loading = true
    this.error = null

    try {
      const { data, error } = await supabase
        .from('examples')
        .insert([{ name }])
        .select()
        .single()

      if (error) throw error

      runInAction(() => {
        if (data) {
          this.data = [data, ...this.data]
        }
        this.loading = false
      })
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        this.loading = false
      })
    }
  }

  async updateData(id: number, name: string) {
    this.loading = true
    this.error = null

    try {
      const { data, error } = await supabase
        .from('examples')
        .update({ name })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      runInAction(() => {
        if (data) {
          const index = this.data.findIndex((item) => item.id === id)
          if (index !== -1) {
            this.data[index] = data
          }
        }
        this.loading = false
      })
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        this.loading = false
      })
    }
  }

  async deleteData(id: number) {
    this.loading = true
    this.error = null

    try {
      const { error } = await supabase
        .from('examples')
        .delete()
        .eq('id', id)

      if (error) throw error

      runInAction(() => {
        this.data = this.data.filter((item) => item.id !== id)
        this.loading = false
      })
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        this.loading = false
      })
    }
  }
}

export default ExampleStore

