import { Box, Heading, Text, Badge, VStack } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import axios from 'axios'

interface ServiceCardProps {
  name: string
  endpoint: string
  apiPath: string
  description: string
}

export default function ServiceCard({ name, endpoint, apiPath, description }: ServiceCardProps) {
  const [status, setStatus] = useState<'online' | 'offline'>('offline')

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await axios.get(`${endpoint}/health`)
        setStatus('online')
      } catch {
        setStatus('offline')
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 5000)  // Check every 5 seconds
    return () => clearInterval(interval)
  }, [endpoint])

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
      <VStack align="start" spacing={3}>
        <Heading size="md">{name}</Heading>
        <Text>{description}</Text>
        <Badge colorScheme={status === 'online' ? 'green' : 'red'}>
          {status}
        </Badge>
      </VStack>
    </Box>
  )
}
