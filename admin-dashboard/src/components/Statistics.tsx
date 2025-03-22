import { Box, SimpleGrid, Text, Stat, StatLabel, StatNumber, StatGroup } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import axios from 'axios'

interface AlertStats {
  total: number
  byType: {
    cobot: number
    machine: number
    ppe: number
  }
  bySeverity: {
    warning: number
    error: number
  }
}

export default function Statistics() {
  const [stats, setStats] = useState<AlertStats>({
    total: 0,
    byType: { cobot: 0, machine: 0, ppe: 0 },
    bySeverity: { warning: 0, error: 0 }
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const alertsResponse = await axios.get(`${process.env.NEXT_PUBLIC_MAIN_SERVICE_URL}/alerts`)
        const alerts = alertsResponse.data.alerts
        
        const newStats = {
          total: alerts.length,
          byType: {
            cobot: alerts.filter((a: any) => a.type === 'cobot').length,
            machine: alerts.filter((a: any) => a.type === 'machine').length,
            ppe: alerts.filter((a: any) => a.type === 'ppe').length
          },
          bySeverity: {
            warning: alerts.filter((a: any) => a.severity === 'warning').length,
            error: alerts.filter((a: any) => a.severity === 'error').length
          }
        }
        
        setStats(newStats)
      } catch (error) {
        console.error('Failed to fetch statistics:', error)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Box>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mb={8}>
        <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="white">
          <Text fontSize="xl" fontWeight="bold" mb={4}>Alerts by Type</Text>
          <StatGroup>
            <Stat>
              <StatLabel>Cobot</StatLabel>
              <StatNumber>{stats.byType.cobot}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Machine</StatLabel>
              <StatNumber>{stats.byType.machine}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>PPE</StatLabel>
              <StatNumber>{stats.byType.ppe}</StatNumber>
            </Stat>
          </StatGroup>
        </Box>

        <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="white">
          <Text fontSize="xl" fontWeight="bold" mb={4}>Alerts by Severity</Text>
          <StatGroup>
            <Stat>
              <StatLabel color="yellow.500">Warnings</StatLabel>
              <StatNumber>{stats.bySeverity.warning}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel color="red.500">Errors</StatLabel>
              <StatNumber>{stats.bySeverity.error}</StatNumber>
            </Stat>
          </StatGroup>
        </Box>
      </SimpleGrid>

      <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="white">
        <Text fontSize="xl" fontWeight="bold" mb={4}>Total Statistics</Text>
        <StatGroup>
          <Stat>
            <StatLabel>Total Alerts</StatLabel>
            <StatNumber>{stats.total}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Active Cameras</StatLabel>
            <StatNumber>{Object.keys(stats.byType).length}</StatNumber>
          </Stat>
        </StatGroup>
      </Box>
    </Box>
  )
}
