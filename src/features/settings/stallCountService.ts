import {
  supabase,
} from '../../lib/supabase.ts'

export type SyncStallCountResult = {
  requestedCount: number
  previousCount: number
  createdCount: number
  totalCount: number
}

type SyncStallCountRow = {
  requested_count: number
  previous_count: number
  created_count: number
  total_count: number
}

export async function getCurrentStallCount(): Promise<number> {
  const {
    count,
    error,
  } = await supabase
    .from(
      'stalls',
    )
    .select(
      'id',
      {
        count:
          'exact',

        head:
          true,
      },
    )

  if (error) {
    throw new Error(
      `Erro ao consultar quantidade de baias: ${error.message}`,
    )
  }

  return count ?? 0
}

export async function syncStallCount(
  targetCount: number,
): Promise<SyncStallCountResult> {
  if (
    !Number.isInteger(
      targetCount,
    )
  ) {
    throw new Error(
      'Informe uma quantidade inteira de baias.',
    )
  }

  if (
    targetCount <
    1
  ) {
    throw new Error(
      'A quantidade de baias deve ser maior que zero.',
    )
  }

  if (
    targetCount >
    500
  ) {
    throw new Error(
      'A quantidade máxima permitida é 500 baias.',
    )
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    'sync_stall_count',
    {
      p_target_count:
        targetCount,
    },
  )

  if (error) {
    throw new Error(
      `Erro ao gerar baias: ${error.message}`,
    )
  }

  const result =
    data?.[0] as
      | SyncStallCountRow
      | undefined

  if (!result) {
    throw new Error(
      'As baias foram processadas, mas o banco não retornou o resultado esperado.',
    )
  }

  return {
    requestedCount:
      Number(
        result.requested_count,
      ),

    previousCount:
      Number(
        result.previous_count,
      ),

    createdCount:
      Number(
        result.created_count,
      ),

    totalCount:
      Number(
        result.total_count,
      ),
  }
}