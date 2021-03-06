const debug = require('debug')('primavera:tests/flow')
import { Resolve, ResolveWith } from '../dist/flow'
import should from 'should'

class ForeignServiceResolver {
	get instanceAccess() {
		return true
	}

	@Resolve({domain:'Test', action:'Do'})
	async doTest(data) {
		if (!this.instanceAccess)
			throw new Error(`ResolveWith method doesn't have access to the component instance.`)
		
		return data
	}

	@Resolve({domain:'Test', test: 'ObjectIsTransmittedAsCopy'})
	async testObjectIsTransmittedAsCopy(payload) {
		payload.is = 'altered'
		return payload
	}
}


class ClientTestClass {

	@ResolveWith({domain: 'Test', action:'Do'})
	simpleResolveWith(message) {
		return message
	}

	@ResolveWith({domain: 'Test'})
	tamperPatternBeforeResolve(message, pattern) {
		debug('tamperPatternBeforeResolve received: ', message, pattern)
		pattern.action = 'Do'
		return message
	}

	@ResolveWith({domain:'Test', test: 'ObjectIsTransmittedAsCopy'})
	async testObjectIsTransmittedAsCopy(payload) {
		payload.is = 'altered'
		return payload
	}
}

describe('Primavera/Flow', function() {

	describe('a foreign resolver is invoked directly through ResolveWith.resolver', function() {
		it('should return the same value as sent (resolver logic)', async function() {
			const sent = { message: "OK" }
			const received = await ResolveWith.resolver({domain:'Test',action:'Do'})(sent)

			received.message.should.equal(sent.message)
		})
	})
	describe('a foreign resolver through a @ResolveWith transformer function (no transformations applied)', function() {
		it('should return the same value as sent (resolver logic)', async function() {
			const sent = { message: "OK" }
			const client = new ClientTestClass()
			const received = await client.simpleResolveWith(sent)

			received.message.should.equal(sent.message)
		})
	})
	describe('a foreign resolver through a @ResolveWith transformer function (pattern is tampered)', function() {
		it('should return the same value as sent (resolver logic)', async function() {
			const sent = { message: "OK" }
			const client = new ClientTestClass()
			const received = await client.tamperPatternBeforeResolve(sent)

			received.message.should.equal(sent.message)
		})
	})
	describe('a foreign resolver is invoked in any way', function() {
		it('should not allow the payload to be modified by the _remote_ function', async function() {
			const payload = { is: 'original' }
			const result = await ResolveWith.resolver({domain:'Test', test:'ObjectIsTransmittedAsCopy'})(payload)
			result.is.should.equal('altered')
			payload.is.should.equal('original')
		})

		it('should not allow the payload to be modified by the @ResolveWith function', async function() {
			const payload = { is: 'original' }
			const client = new ClientTestClass()
			const result = await client.testObjectIsTransmittedAsCopy(payload)
			result.is.should.equal('altered')
			payload.is.should.equal('original')
		})
	})
})